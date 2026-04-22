import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, timingSafeEqual } from "node:crypto";

function hashKey(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>("ADMIN_API_KEY")?.trim();
    if (!expected) {
      throw new ServiceUnavailableException(
        "Admin API is disabled: set ADMIN_API_KEY in the API environment",
      );
    }

    const req = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    const headerKey = req.headers["x-admin-key"];
    const auth = req.headers["authorization"];
    const provided =
      (typeof headerKey === "string" && headerKey) ||
      (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")
        ? auth.slice("bearer ".length).trim()
        : "");

    if (!provided) {
      throw new UnauthorizedException("Missing admin credentials (x-admin-key or Authorization: Bearer …)");
    }

    const a = hashKey(provided);
    const b = hashKey(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException("Invalid admin credentials");
    }

    return true;
  }
}
