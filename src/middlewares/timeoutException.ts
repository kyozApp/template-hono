import { HTTPException } from "hono/http-exception";

export const customTimeoutException = () => {
	return new HTTPException(408, {
		message:
			"Tiempo de espera agotado. Por favor, intente nuevamente más tarde.",
	});
};
