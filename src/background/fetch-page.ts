import { Sema } from "async-sema";

/**
 * 求められるままネットワークコネクションを開きまくるとブラウザの動作に支障が出るため、
 * セマフォである程度制限します。
 * ページを複数開いても問題ないように、
 * ページ単体の制限よりある程度余裕を持たせます。
 */
const fetchSema = new Sema(3 * 3);

/**
 * ネットワーク通信のタイムアウト時間。
 * やたらと時間がかかるサイトはどうせろくでもないことが多いので深追いしません。
 * 30秒に設定します。
 */
const timeoutFetchPageMilliSeconds = 30000 as const;

/** ネットワーク帯域を利用する関数を明示化してまとめます。 */
export async function fetchPage(url: string): Promise<Response> {
  await fetchSema.acquire();
  try {
    return await fetch(url, {
      // 認証情報が不用意に送られないようにします。サイトの誤動作防止の意味が強い。
      credentials: "omit",
      // タイムアウト中断コントローラ。
      signal: AbortSignal.timeout(timeoutFetchPageMilliSeconds),
    });
  } finally {
    fetchSema.release();
  }
}
