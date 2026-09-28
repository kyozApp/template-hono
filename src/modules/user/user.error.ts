import { AppException } from "../../middlewares/handlers.js";

export const UserErrors = {
	userNotFound: () =>
		new AppException(404, {
			message: "El usuario no se encontró.",
			code: "USER_NOT_FOUND",
		}),

	usernameAlreadyExists: () =>
		new AppException(409, {
			message: "El nombre de usuario ya se encuentra registrado.",
			code: "USERNAME_ALREADY_EXISTS",
		}),

	emailAlreadyExists: () =>
		new AppException(409, {
			message: "El correo electrónico ya se encuentra registrado.",
			code: "EMAIL_ALREADY_EXISTS",
		}),

	cannotDeleteSelf: () =>
		new AppException(400, {
			message: "No puedes eliminar tu propia cuenta de usuario.",
			code: "CANNOT_DELETE_SELF",
		}),
};
