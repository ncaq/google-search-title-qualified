import { Sema } from "async-sema";

/**
 * 求められるままネットワークコネクションを開きまくるとブラウザの動作に支障が出るため、
 * セマフォである程度制限します。
 * ページを複数開いても問題ないように、
 * ページ単体の制限よりある程度余裕を持たせます。
 */
const fetchSema = new Sema(3 * 3);

/** ネットワーク帯域を利用する関数を明示化してまとめます。 */
export async function fetchPage(url: string): Promise<Response> {
  await fetchSema.acquire();
  try {
    const abortController = new AbortController();
    // ネットワーク通信は15秒でタイムアウト。
    // やたらと時間がかかるサイトはどうせろくでもないことが多い。
    const timeout = setTimeout(() => {
      abortController.abort();
    }, 15 * 1000);
    try {
      return await fetch(url, {
        // 妙なリクエストを送らないように制限を加えます(こちらで書かないと変なこと起きないと思いますが)
        mode: "no-cors",
        // 認証情報が不用意に送られないようにします。サイトの誤動作防止の意味が強い。
        credentials: "omit",
        // 出来るだけブラウザのキャッシュを使っていきます。
        cache: "force-cache",
        // リダイレクトを追うことを明示的に指定。
        redirect: "follow",
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
