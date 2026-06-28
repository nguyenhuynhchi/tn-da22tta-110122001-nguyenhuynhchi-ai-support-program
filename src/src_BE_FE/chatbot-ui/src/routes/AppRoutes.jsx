import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Chatbot from '../components/cpn_chat_suggest_assignment/SuggestAssignmentPage';
import AnalysisCodePage from '../components/cpn_chat_analysis_code/AnalysisCodePage';

// Có thể thêm các route khác sau này.
// import Login from '../pages/Login';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Trang mặc định (Root) sẽ hiển thị Chatbot */}
        <Route path="/" element={<Chatbot />} />

        {/* Đường dẫn /chat riêng */}
        <Route path="/chat" element={<Chatbot />} />

        {/* Giao diện phân tích mã nguồn */}
        <Route path="/analysis" element={<AnalysisCodePage />} />

        {/* Chuyển hướng tất cả đường dẫn lạ về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
