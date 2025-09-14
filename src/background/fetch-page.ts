import { Sema } from "async-sema";
import { alarms } from "webextension-polyfill";

/**
 * 求められるままネットワークコネクションを開きまくるとブラウザの動作に支障が出るため、
 * セマフォである程度制限します。
 * ページを複数開いても問題ないように、
 * ページ単体の制限よりある程度余裕を持たせます。
 */
const fetchSema = new Sema(3 * 3);

/**
 * ネットワーク通信のタイムアウト時間。
 * Alarms APIの最小値は1分のため、1分に設定。
 * やたらと時間がかかるサイトはどうせろくでもないことが多いので深追いしません。
 */
const timeoutFetchMinutes = 1 as const;

/** アクティブなfetch処理を管理するMap */
const activeFetches = new Map<string, AbortController>();

/** Alarms APIのリスナーを初期化 */
export function initializeFetchAlarmListener(): void {
  alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith("fetch-timeout-")) {
      const controller = activeFetches.get(alarm.name);
      if (controller) {
        controller.abort();
        activeFetches.delete(alarm.name);
      }
    }
  });
}

/** ネットワーク帯域を利用する関数を明示化してまとめます。 */
export async function fetchPage(url: string): Promise<Response> {
  await fetchSema.acquire();
  try {
    const abortController = new AbortController();
    const alarmName = `fetch-timeout-${Date.now().toString()}-${Math.random().toString()}`;
    activeFetches.set(alarmName, abortController);
    // タイムアウト用のアラームを設定
    alarms.create(alarmName, {
      delayInMinutes: timeoutFetchMinutes,
    });
    try {
      return await fetch(url, {
        // 認証情報が不用意に送られないようにします。サイトの誤動作防止の意味が強い。
        credentials: "omit",
        // タイムアウト中断コントローラ。
        signal: abortController.signal,
      });
    } finally {
      // クリーンアップ。
      alarms.clear(alarmName).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("alarms.clear is error.", err, alarmName);
      });
      activeFetches.delete(alarmName);
    }
  } finally {
    fetchSema.release();
  }
}
