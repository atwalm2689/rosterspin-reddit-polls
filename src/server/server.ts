import type { IncomingMessage, ServerResponse } from "node:http";
import { context, reddit, redis } from "@devvit/web/server";
import type {
  PartialJsonValue,
  TriggerResponse,
  UiResponse,
} from "@devvit/web/shared";
import {
  ApiEndpoint,
  type DecrementRequest,
  type DecrementResponse,
  type IncrementRequest,
  type IncrementResponse,
  type InitResponse,
  type VoteResponse,
} from "../shared/api.ts";
import { once } from "node:events";

const POLL = {
  sport: "NHL",
  awayTeam: "Maple Leafs",
  homeTeam: "Golden Knights",
  gameTime: "2026-06-21T20:00:00-04:00",
};
type PollConfig = typeof POLL;

async function getPollConfig(context: any, postId: string): Promise<PollConfig> {
  const savedConfig = await context.redis.get(`poll:${postId}:config`);

  if (savedConfig) {
    return JSON.parse(savedConfig);
  }

  return POLL;
}
export async function serverOnRequest(
  req: IncomingMessage,
  rsp: ServerResponse,
): Promise<void> {
  try {
    await onRequest(req, rsp);
  } catch (err) {
    const msg = `server error; ${err instanceof Error ? err.stack : err}`;
    console.error(msg);
    writeJSON<ErrorResponse>(500, { error: msg, status: 500 }, rsp);
  }
}

async function onRequest(
  req: IncomingMessage,
  rsp: ServerResponse,
): Promise<void> {
  const url = req.url;

  if (!url || url === "/") {
    writeJSON<ErrorResponse>(404, { error: "not found", status: 404 }, rsp);
    return;
  }

  const endpoint = url as ApiEndpoint;

  let body: ApiResponse | UiResponse | ErrorResponse;
  switch (endpoint) {
    case ApiEndpoint.Init:
      body = await onInit();
      break;
case ApiEndpoint.VoteTeamA:
  body = await onVoteTeamA();
  break;

case ApiEndpoint.VoteTeamB:
  body = await onVoteTeamB();
  break;
    case ApiEndpoint.OnPostCreate:
      body = await onMenuNewPost();
      break;
    case ApiEndpoint.OnAppInstall:
      body = await onAppInstall();
      break;
    default:
      endpoint satisfies never;
      body = { error: "not found", status: 404 };
      break;
  }

  writeJSON<PartialJsonValue>("status" in body ? body.status : 200, body, rsp);
}

type ApiResponse = InitResponse | IncrementResponse | DecrementResponse | VoteResponse;

type ErrorResponse = {
  error: string;
  status: number;
};

function getPostId(): string {
  if (!context.postId) {
    throw Error("no post ID");
  }
  return context.postId;
}

function getPostCountKey(postId: string): string {
  return `count:${postId}`;
}

async function onInit(): Promise<InitResponse> {
  const postId = getPostId();
  const totals = await getVoteTotals();
const poll = await getPollConfig(context, postId);
 return {
  type: "init",
  postId,
  username: context.username ?? "user",
  meta: `${poll.sport} • Today`,
  question: `Who wins: ${poll.awayTeam} @ ${poll.homeTeam}?`,
  teamA: poll.awayTeam,
  teamB: poll.homeTeam,
  gameTime: poll.gameTime,
  ...totals,
};
}

async function getVoteTotals() {
  const teamAVotes = Number((await redis.get("teamAVotes")) ?? 0);
  const teamBVotes = Number((await redis.get("teamBVotes")) ?? 0);

  const totalVotes = teamAVotes + teamBVotes;

  return { teamAVotes, teamBVotes, totalVotes };
}

function isPollLocked(): boolean {
  return Date.now() >= new Date(POLL.gameTime).getTime();
}

function getUserVoteKey() {
  const postId = getPostId();
  const username = context.username ?? "anonymous";
  return `vote:${postId}:${username}`;
}

async function onVoteTeamA(): Promise<VoteResponse> {
  const userVoteKey = getUserVoteKey();
  const existingVote = await redis.get(userVoteKey);
if (isPollLocked()) {
  const totals = await getVoteTotals();

  return {
    type: "vote",
    team: existingVote ?? "",
    teamA: POLL.awayTeam,
    teamB: POLL.homeTeam,
    gameTime: POLL.gameTime,
    ...totals,
  };
}
  if (existingVote) {
    const totals = await getVoteTotals();

return {
  type: "vote",
  team: existingVote,
  teamA: POLL.awayTeam,
  teamB: POLL.homeTeam,
  gameTime: POLL.gameTime,
  ...totals,
};
  }

  await redis.set(userVoteKey, POLL.awayTeam);
  await redis.incrBy("teamAVotes", 1);

  const totals = await getVoteTotals();

return {
  type: "vote",
  team: POLL.awayTeam,
  teamA: POLL.awayTeam,
  teamB: POLL.homeTeam,
  gameTime: POLL.gameTime,
  ...totals,
};
}

async function onVoteTeamB(): Promise<VoteResponse> {
  const userVoteKey = getUserVoteKey();
  const existingVote = await redis.get(userVoteKey);
if (isPollLocked()) {
  const totals = await getVoteTotals();

  return {
    type: "vote",
    team: existingVote ?? "",
    teamA: POLL.awayTeam,
    teamB: POLL.homeTeam,
    gameTime: POLL.gameTime,
    ...totals,
  };
}
  if (existingVote) {
    const totals = await getVoteTotals();
return {
  type: "vote",
  team: existingVote,
  teamA: POLL.awayTeam,
  teamB: POLL.homeTeam,
  gameTime: POLL.gameTime,
  ...totals,
};
  }

  await redis.set(userVoteKey, POLL.homeTeam);
  await redis.incrBy("teamBVotes", 1);

  const totals = await getVoteTotals();

return {
  type: "vote",
  team: POLL.homeTeam,
  teamA: POLL.awayTeam,
  teamB: POLL.homeTeam,
  gameTime: POLL.gameTime,
  ...totals,
};
}

async function onIncrement(req: IncomingMessage): Promise<IncrementResponse> {
  const postId = getPostId();
  const { amount } = await readJSON<IncrementRequest>(req).catch(() => ({
    amount: 1,
  }));
  const incrementBy = Number.isFinite(amount) ? amount : 1;
  const count = await redis.incrBy(getPostCountKey(postId), incrementBy);
  return {
    type: "increment",
    postId,
    count,
  };
}

async function onDecrement(req: IncomingMessage): Promise<DecrementResponse> {
  const postId = getPostId();
  const { amount } = await readJSON<DecrementRequest>(req).catch(() => ({
    amount: 1,
  }));
  const parsedAmount = typeof amount === "number" ? amount : Number(amount);
  const decrementBy = Number.isFinite(parsedAmount) ? parsedAmount : 1;
  const count = Number(
    await redis.incrBy(getPostCountKey(postId), -decrementBy),
  );
  return {
    type: "decrement",
    postId,
    count,
  };
}

async function onMenuNewPost(): Promise<UiResponse> {
  const post = await reddit.submitCustomPost({ title: context.appName });
  return {
    showToast: { text: `Post ${post.id} created.`, appearance: "success" },
    navigateTo: post.url,
  };
}

async function onAppInstall(): Promise<TriggerResponse> {
  await reddit.submitCustomPost({
    title: "rosterspin-dev",
  });

  return {};
}

function writeJSON<T extends PartialJsonValue>(
  status: number,
  json: Readonly<T>,
  rsp: ServerResponse,
): void {
  const body = JSON.stringify(json);
  const len = Buffer.byteLength(body);
  rsp.writeHead(status, {
    "Content-Length": len,
    "Content-Type": "application/json",
  });
  rsp.end(body);
}

async function readJSON<T>(req: IncomingMessage): Promise<T> {
  const chunks: Uint8Array[] = [];
  req.on("data", (chunk) => chunks.push(chunk));
  await once(req, "end");
  return JSON.parse(`${Buffer.concat(chunks)}`);
}
