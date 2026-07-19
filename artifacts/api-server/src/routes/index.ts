import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import authGoogleRouter from "./auth-google";
import budgetRouter from "./budget";
import vendorsRouter from "./vendors";
import dasturxonRouter from "./dasturxon";
import sufficiencyRouter from "./sufficiency";
import marketplaceRouter from "./marketplace";
import sellerRouter from "./seller";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import organizerRouter from "./organizer";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(authGoogleRouter);
router.use(budgetRouter);
router.use(vendorsRouter);
router.use(dasturxonRouter);
router.use(sufficiencyRouter);
router.use(marketplaceRouter);
router.use(sellerRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(organizerRouter);
router.use(storageRouter);

export default router;
