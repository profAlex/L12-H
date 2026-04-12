import { Router } from "express";
import { IdParamName } from "./util-enums/id-names";
import { validateDeviceId } from "./validation-middleware/security-device-deviceId-validation";
import {
    container,
} from "../composition-root/composition-root";
import { SecurityDevicesHandler } from "./router-handlers/security-devices-router-description";
import { TYPES } from "../composition-root/ioc-types";
import { RefreshTokenGuard } from "./guard-middleware/refresh-token-guard";

export const securityDevicesRouter = Router();

const refreshTokenGuardInstance = container.get<RefreshTokenGuard>(TYPES.RefreshTokenGuard);
const securityDevicesHandler = container.get<SecurityDevicesHandler>(TYPES.SecurityDevicesHandler);

securityDevicesRouter.delete(
    `/:${IdParamName.DeviceId}`,
    refreshTokenGuardInstance.refreshTokenGuard,
    validateDeviceId,
    securityDevicesHandler.removeSessionById,
);

securityDevicesRouter.delete(
    `/`,
    refreshTokenGuardInstance.refreshTokenGuard,
    securityDevicesHandler.removeAllButOneSession,
);

securityDevicesRouter.get(
    `/`,
    refreshTokenGuardInstance.refreshTokenGuard,
    securityDevicesHandler.getDevicesList,
);