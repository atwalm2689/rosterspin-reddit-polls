import { ApiEndpoint } from "../shared/api.ts";

const yankeesButton = document.getElementById("yankees-button") as HTMLButtonElement;
const blueJaysButton = document.getElementById("bluejays-button") as HTMLButtonElement;

const pollMeta = document.querySelector(".poll-meta") as HTMLSpanElement;
const pollQuestion = document.getElementById("poll-question") as HTMLParagraphElement;
const teamALabel = document.getElementById("team-a-label") as HTMLSpanElement;
const teamBLabel = document.getElementById("team-b-label") as HTMLSpanElement;

async function init() {
  const response = await fetch(ApiEndpoint.Init);
  const data = await response.json();

  pollMeta.textContent = data.meta;
  pollQuestion.textContent = data.question;
  teamALabel.textContent = data.teamA;
  teamBLabel.textContent = data.teamB;

  const teamAPercent =
    data.totalVotes === 0 ? 0 : Math.round((data.teamAVotes / data.totalVotes) * 100);

  const teamBPercent =
    data.totalVotes === 0 ? 0 : Math.round((data.teamBVotes / data.totalVotes) * 100);

  document.getElementById("yankees-percent")!.textContent = `${teamAPercent}%`;
  document.getElementById("bluejays-percent")!.textContent = `${teamBPercent}%`;
  document.getElementById("vote-count")!.textContent = `${data.totalVotes} votes`;
  document.getElementById("progress-fill")!.style.width = `${teamAPercent}%`;
}

init();

async function vote(endpoint: string, team: string) {
  const response = await fetch(endpoint, { method: "POST" });
  const data = await response.json();

const teamAPercent =
  data.totalVotes === 0 ? 0 : Math.round((data.teamAVotes / data.totalVotes) * 100);

const teamBPercent =
  data.totalVotes === 0 ? 0 : Math.round((data.teamBVotes / data.totalVotes) * 100);

document.getElementById("yankees-percent")!.textContent =
  `${teamAPercent}%`;

document.getElementById("bluejays-percent")!.textContent =
  `${teamBPercent}%`;

document.getElementById("vote-count")!.textContent =
  `${data.totalVotes} votes`;

document.getElementById("progress-fill")!.style.width =
  `${teamAPercent}%`;


}

yankeesButton.addEventListener("click", () => {
  vote(ApiEndpoint.VoteYankees, "Team A");
});

blueJaysButton.addEventListener("click", () => {
  vote(ApiEndpoint.VoteBlueJays, "Team B");
});