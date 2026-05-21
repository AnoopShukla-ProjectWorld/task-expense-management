import {
  useForm,
} from "react-hook-form";

import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const navigate =
    useNavigate();

  const { login } = useAuth();

  const {
    register,
    handleSubmit,
  } = useForm();

const onSubmit = async (data) => {
  const result = await login(data);

  if (result.success) {
    const role = result.user.role;

    if (role === "ADMIN") navigate("/admin");
    else if (role === "MANAGER") navigate("/manager");
    else navigate("/employee");
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit(
          onSubmit
        )}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-6 text-center text-3xl font-bold">
          Login
        </h1>

        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            {...register(
              "email"
            )}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            {...register(
              "password"
            )}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black p-3 text-white"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;