import { Sema } from "async-sema";

/**
 * 求められるままネットワークコネクションを開きまくるとブラウザの動作に支障が出るため、
 * セマフォである程度制限します。
 * ページを複数開いても問題ないように、
 * ページ単体の制限よりある程度余裕を持たせます。
 */
const fetchSema = new Sema(3 * 3);

/** ネットワーク通信は15秒でタイムアウト。
 * やたらと時間がかかるサイトはどうせろくでもないことが多いので深追いしません。
 */
const timeoutFetchNetwork = 15 * 1000;

/** ネットワーク帯域を利用する関数を明示化してまとめます。 */
export async function fetchPage(url: string): Promise<Response> {
  await fetchSema.acquire();
  try {
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
    }, timeoutFetchNetwork);
    try {
      return await fetch(url, {
        // タイムアウト中断コントローラ。
        signal: abortController.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  } finally {
    fetchSema.release();
  }
}
