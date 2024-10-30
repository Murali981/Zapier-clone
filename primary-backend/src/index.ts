import express from "express";
import cors from "cors";
import { userRouter } from "./router/user";
import { zapRouter } from "./router/zap";
import { triggerRouter } from "./router/trigger";
import { actionRouter } from "./router/action";
// At the very top of your entry file (index.ts)
import * as dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());

app.use(cors());

app.use("/api/v1/user", userRouter);

app.use("/api/v1/zap", zapRouter);

app.use("/api/v1/trigger", triggerRouter);

app.use("/api/v1/action", actionRouter);

app.listen(3002);
