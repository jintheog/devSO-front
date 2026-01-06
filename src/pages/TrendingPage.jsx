import { getTrending } from "../api";
import PostGridPage from "./PostGridPage.jsx";

const TrendingPage = () => {
  return (
    <PostGridPage
      title="최신 게시글"
      fetcher={getTrending}
      emptyText="트렌딩 게시글이 없습니다."
      showHeader={false}
      wrapContainer={false}
    />
  );
};

export default TrendingPage;


