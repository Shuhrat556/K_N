import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { MainAnswerDto } from "./dto/main-answer.dto";
import { SubmitWarmupDto } from "./dto/submit-warmup.dto";
import { TestFlowService } from "./test-flow.service";

@Controller("sessions")
export class TestFlowController {
  constructor(private readonly flow: TestFlowService) {}

  @Post()
  createSession() {
    return this.flow.createSession();
  }

  @Get(":sessionId/warmup/questions")
  warmupQuestions(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.flow.getWarmupQuestions(sessionId);
  }

  @Post(":sessionId/warmup/submit")
  submitWarmup(
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Body() body: SubmitWarmupDto,
  ) {
    return this.flow.submitWarmup(sessionId, body);
  }

  @Post(":sessionId/warmup/continue")
  warmupContinue(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.flow.acknowledgeWarmupWarning(sessionId);
  }

  @Get(":sessionId/main/questions")
  mainQuestions(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.flow.getMainQuestions(sessionId);
  }

  @Post(":sessionId/main/answer")
  mainAnswer(
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Body() body: MainAnswerDto,
  ) {
    return this.flow.submitMainAnswer(sessionId, body.questionId, body.value);
  }

  @Post(":sessionId/main/complete")
  mainComplete(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.flow.completeMain(sessionId);
  }

  @Get(":sessionId/adaptive/questions")
  adaptiveQuestions(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.flow.getAdaptiveQuestions(sessionId);
  }

  @Post(":sessionId/adaptive/answer")
  adaptiveAnswer(
    @Param("sessionId", ParseUUIDPipe) sessionId: string,
    @Body() body: MainAnswerDto,
  ) {
    return this.flow.submitAdaptiveAnswer(sessionId, body.questionId, body.value);
  }

  @Post(":sessionId/adaptive/complete")
  adaptiveComplete(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.flow.completeAdaptive(sessionId);
  }

  @Get(":sessionId/result")
  result(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.flow.getResult(sessionId);
  }
}
