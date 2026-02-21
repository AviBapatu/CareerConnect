import pinoHttp from "pino-http";

export const requestLogger = pinoHttp({
    customProps: (req) => ({
        userId: req.user?._id
    })
});
