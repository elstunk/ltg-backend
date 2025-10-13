import { tournaments } from "../data/mock.js";

export default async function routes(app) {
  app.get("/api/tournaments", async () => {
    return { ok: true, tournaments };
  });

  // If you need a self-contained research endpoint here, you can wire it too:
  // import { researchByTournament } from "../data/mock.js";
  // app.get("/api/tournament/:id/research", async (req, reply) => {
  //   const { id } = req.params;
  //   const data = researchByTournament[id];
  //   if (!data) return reply.code(404).send({ ok: false, error: "Not found" });
  //   return data;
  // });
}
