import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtUser } from "../common/auth/jwt.types";
import { AnswerDto, GenerateQuizDto, QuizQueryDto } from "./dto";
import { QuizService } from "./quiz.service";

@Controller("api/quiz")
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly svc: QuizService) {}

  @Get()
  list(@CurrentUser() user: JwtUser, @Query() q: QuizQueryDto) {
    return this.svc.generate(user.sub, q);
  }

  @Post("answer")
  answer(@CurrentUser() user: JwtUser, @Body() dto: AnswerDto) {
    return this.svc.answer(user.sub, dto);
  }

  @Get("progress")
  progress(@CurrentUser() user: JwtUser) {
    return this.svc.progress(user.sub);
  }

  @Post("generate")
  generate(@CurrentUser() user: JwtUser, @Body() dto: GenerateQuizDto) {
    return this.svc.generate(user.sub, dto);
  }
}
