import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { ClustersModule } from "./clusters/clusters.module";
import { FacultiesModule } from "./faculties/faculties.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QuestionsModule } from "./questions/questions.module";
import { TestFlowModule } from "./test-flow/test-flow.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ClustersModule,
    QuestionsModule,
    FacultiesModule,
    TestFlowModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
