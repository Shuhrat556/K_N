import { Module } from "@nestjs/common";
import { TestFlowController } from "./test-flow.controller";
import { TestFlowService } from "./test-flow.service";

@Module({
  controllers: [TestFlowController],
  providers: [TestFlowService],
})
export class TestFlowModule {}
