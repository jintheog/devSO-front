import { getFeed } from "../api";
import PostGridPage from "./PostGridPage.jsx";

const FeedPage = () => {
  return (
    <PostGridPage
      title="최신 게시글"
      fetcher={getFeed}
      emptyText="피드에 표시할 게시글이 없습니다."
      enableSearch
      showHeader={false}
      wrapContainer={false}
    />
  );
};

export default FeedPage;


