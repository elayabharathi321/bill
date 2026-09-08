import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useAuthForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  function submit(event) {
    event.preventDefault();
    navigate("/dashboard");
  }

  return {
    showPassword,
    togglePassword: () => setShowPassword((visible) => !visible),
    submit,
  };
}
