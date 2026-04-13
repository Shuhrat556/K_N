import { Route, Routes } from "react-router-dom";
import { Admin } from "./pages/Admin";
import { Feedback } from "./pages/Feedback";
import { Landing } from "./pages/Landing";
import { Readiness } from "./pages/Readiness";
import { Result } from "./pages/Result";
import { Test } from "./pages/Test";
import { Universities } from "./pages/Universities";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/readiness" element={<Readiness />} />
      <Route path="/test" element={<Test />} />
      <Route path="/result" element={<Result />} />
      <Route path="/universities" element={<Universities />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
