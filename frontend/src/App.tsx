import { Route, Routes } from "react-router-dom";
import { About } from "./pages/About";
import { Admin } from "./pages/Admin";
import { Feedback } from "./pages/Feedback";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Readiness } from "./pages/Readiness";
import { Result } from "./pages/Result";
import { Specialties } from "./pages/Specialties";
import { Subscriptions } from "./pages/Subscriptions";
import { Test } from "./pages/Test";
import { Universities } from "./pages/Universities";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/specialties" element={<Specialties />} />
      <Route path="/login" element={<Login />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="/readiness" element={<Readiness />} />
      <Route path="/test" element={<Test />} />
      <Route path="/result" element={<Result />} />
      <Route path="/universities" element={<Universities />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
