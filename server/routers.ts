import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  enforceRequestLimit,
  generateAcademicJson,
  ideaInputSchema,
  titleInputSchema,
  topicInputSchema,
} from "./research-ai";

function requestKey(ctx: { req: { ip?: string; socket?: { remoteAddress?: string } } }) {
  return ctx.req.ip || ctx.req.socket?.remoteAddress || "unknown";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  research: router({
    generateTopics: publicProcedure.input(topicInputSchema).mutation(async ({ ctx, input }) => {
      enforceRequestLimit(requestKey(ctx));
      const result = await generateAcademicJson("Create exactly the requested number of distinct, feasible radiology research topic suggestions. Match every selection. For every item include: title (English), arabicTitle, idea, aim, objectives (array), significance, requirements (array), difficulty (Basic/Intermediate/Advanced), and assumptions (array). Do not cite or imply a database search. Keep methods aligned with the selected study type. Return { items: [...] }.", input);
      if (Array.isArray(result.items) && result.items.length > input.count) result.items = result.items.slice(0, input.count);
      if (!Array.isArray(result.items) || result.items.length !== input.count || result.items.some((item) => !item || typeof item !== "object" || !("title" in item) || !("arabicTitle" in item) || !("aim" in item) || !("objectives" in item))) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: "AI output did not meet the requested title count or required fields. Please retry." });
      }
      return result;
    }),
    developIdea: publicProcedure.input(ideaInputSchema).mutation(async ({ ctx, input }) => {
      enforceRequestLimit(requestKey(ctx));
      const result = await generateAcademicJson("Develop this early-stage radiology research idea. Return { titleOptions: [{title, arabicTitle, rationale}], researchProblem, researchQuestion, aim, objectives: [], suggestedMethodology, strengths: [], limitations: [], assumptions: [] }. Offer 3 distinct academic titles. Do not invent facts or results.", input);
      if (!Array.isArray(result.titleOptions) || result.titleOptions.length < 3 || result.titleOptions.length > 5 || !result.researchQuestion || !result.aim) throw new TRPCError({ code: "BAD_GATEWAY", message: "AI output did not include the required idea-development sections. Please retry." });
      return result;
    }),
    improveTitle: publicProcedure.input(titleInputSchema).mutation(async ({ ctx, input }) => {
      enforceRequestLimit(requestKey(ctx));
      const result = await generateAcademicJson("Critically improve this existing radiology research title. Return { analysis, weaknesses: [], improvedTitle, improvedArabicTitle, alternatives: [{title, arabicTitle, difference}] }. Offer 3 to 5 alternatives. Preserve the study meaning and do not invent study findings.", input);
      if (!result.improvedTitle || !Array.isArray(result.alternatives) || result.alternatives.length < 3 || result.alternatives.length > 5) throw new TRPCError({ code: "BAD_GATEWAY", message: "AI output did not include the required refined title and alternatives. Please retry." });
      return result;
    }),
    createProposal: publicProcedure.input(titleInputSchema).mutation(async ({ ctx, input }) => {
      enforceRequestLimit(requestKey(ctx));
      const result = await generateAcademicJson("Prepare a preliminary research proposal outline from this radiology title. Return { title, arabicTitle, introduction, researchProblem, aim, objectives: [], researchQuestions: [], proposedMethodology, studyPopulation, inclusionCriteria: [], exclusionCriteria: [], dataCollectionMethods: [], expectedOutcomes, assumptions: [], reviewNotice }. Expected outcomes are hypotheses only; no fabricated results. Include a clear reviewNotice that this draft must be reviewed by the academic supervisor and statistician and checked for feasibility, ethics, and novelty through a separate literature review.", input);
      const required = ["introduction", "researchProblem", "aim", "objectives", "researchQuestions", "proposedMethodology", "studyPopulation", "inclusionCriteria", "exclusionCriteria", "dataCollectionMethods", "expectedOutcomes", "reviewNotice"];
      if (required.some((key) => !(key in result))) throw new TRPCError({ code: "BAD_GATEWAY", message: "AI output did not include all proposal-outline sections. Please retry." });
      return result;
    }),
  }),
});

export type AppRouter = typeof appRouter;
