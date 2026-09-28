import { AppException } from "../../middlewares/handlers.js";

export const AuthErrors = {
	usernameAlreadyExists: () =>
		new AppException(409, {
			message: "El usuario ingresado ya se encuentra registrado.",
			code: "USERNAME_ALREADY_EXISTS",
		}),

	emailAlreadyExists: () =>
		new AppException(409, {
			message: "El correo electrónico ya se encuentra registrado.",
			code: "EMAIL_ALREADY_EXISTS",
		}),

	userNotFound: () =>
		new AppException(401, {
			message: "El usuario ingresado no se encuentra registrado.",
			code: "USER_NOT_FOUND",
		}),

	inactiveAccount: () =>
		new AppException(401, {
			message:
				"Esta cuenta se encuentra inactiva. Por favor, contacte al administrador.",
			code: "INACTIVE_ACCOUNT",
		}),

	invalidCredentials: () =>
		new AppException(401, {
			message: "Credenciales incorrectas.",
			code: "INVALID_CREDENTIALS",
		}),
};
