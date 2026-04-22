import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminApiKeyGuard } from "./admin-api-key.guard";
import { QuestionPhase } from "@prisma/client";
import { CreateQuestionDto } from "../questions/dto/create-question.dto";
import { UpdateQuestionDto } from "../questions/dto/update-question.dto";
import { QuestionsService } from "../questions/questions.service";

@Controller("admin/questions")
@UseGuards(AdminApiKeyGuard)
export class QuestionsAdminController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  list(
    @Query("clusterId") clusterId?: string,
    @Query("phase") phase?: QuestionPhase,
  ) {
    let cid: number | undefined;
    if (clusterId != null && clusterId !== "") {
      const n = Number(clusterId);
      if (!Number.isFinite(n)) {
        throw new BadRequestException("clusterId must be a number");
      }
      cid = n;
    }
    return this.questions.list(cid, phase);
  }

  @Post()
  create(@Body() body: CreateQuestionDto) {
    return this.questions.create(body);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateQuestionDto) {
    return this.questions.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.questions.remove(id);
  }
}
