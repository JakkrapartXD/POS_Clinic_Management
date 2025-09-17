import { Elysia, t } from "elysia";
import { clinicController } from "../controllers/ClinicController";

export const clinicRoutes = new Elysia()
  .group("/clinic", app => app.use(clinicController));
