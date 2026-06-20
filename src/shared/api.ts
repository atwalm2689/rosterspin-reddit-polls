export type InitResponse = {
  type: "init";
  postId: string;
  username: string;
  meta: string;
  question: string;
  teamA: string;
  teamB: string;
  teamAVotes: number;
  teamBVotes: number;
  totalVotes: number;
};

export type IncrementResponse = {
  type: "increment";
  postId: string;
  count: number;
};

export type IncrementRequest = {
  amount: number;
};

export type DecrementResponse = {
  type: "decrement";
  postId: string;
  count: number;
};

export type DecrementRequest = {
  amount: number;
};
export type VoteResponse = {
  type: "vote";
  team: string;
  teamA: string;
  teamB: string;
  teamAVotes: number;
  teamBVotes: number;
  totalVotes: number;
};
export const ApiEndpoint = {
  Init: "/api/init",
VoteYankees: "/api/vote-yankees",
VoteBlueJays: "/api/vote-bluejays",
  OnPostCreate: "/internal/menu/post-create",
  OnAppInstall: "/internal/on-app-install",
} as const;

export type ApiEndpoint = (typeof ApiEndpoint)[keyof typeof ApiEndpoint];
