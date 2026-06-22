import { ApiEndpoint } from "../shared/api.ts";

const teamAButton = document.getElementById("teamA-button") as HTMLButtonElement;
const teamBButton = document.getElementById("teamB-button") as HTMLButtonElement;

const pollMeta = document.querySelector(".poll-meta") as HTMLSpanElement;
const pollQuestion = document.getElementById("poll-question") as HTMLParagraphElement;
const countdownEl = document.getElementById("countdown") as HTMLSpanElement;
const teamALabel = document.getElementById("team-a-label") as HTMLSpanElement;
const teamBLabel = document.getElementById("team-b-label") as HTMLSpanElement;

async function init() {
  const response = await fetch(ApiEndpoint.Init);
  const data = await response.json();

  pollMeta.textContent = data.meta;
  pollQuestion.textContent = data.question;
  teamALabel.textContent = data.teamA;
  teamBLabel.textContent = data.teamB;
  startCountdown(data.gameTime);

  const teamAPercent =
    data.totalVotes === 0 ? 0 : Math.round((data.teamAVotes / data.totalVotes) * 100);

  const teamBPercent =
    data.totalVotes === 0 ? 0 : Math.round((data.teamBVotes / data.totalVotes) * 100);

  document.getElementById("teamA-percent")!.textContent = `${teamAPercent}%`;
  document.getElementById("teamB-percent")!.textContent = `${teamBPercent}%`;
  document.getElementById("vote-count")!.textContent = `${data.totalVotes} votes`;

}

init();

async function vote(endpoint: string, team: string) {
  const response = await fetch(endpoint, { method: "POST" });
  const data = await response.json();

const teamAPercent =
  data.totalVotes === 0 ? 0 : Math.round((data.teamAVotes / data.totalVotes) * 100);

const teamBPercent =
  data.totalVotes === 0 ? 0 : Math.round((data.teamBVotes / data.totalVotes) * 100);

document.getElementById("teamA-percent")!.textContent =
  `${teamAPercent}%`;

document.getElementById("teamB-percent")!.textContent =
  `${teamBPercent}%`;

document.getElementById("vote-count")!.textContent =
  `${data.totalVotes} votes`;
teamAButton.disabled = true;
teamBButton.disabled = true;
teamAButton.classList.add("poll-option--locked");
teamBButton.classList.add("poll-option--locked");



}

teamAButton.addEventListener("click", () => {
  vote(ApiEndpoint.VoteTeamA, "Team A");
  teamAButton.classList.add("poll-option--voted");
teamBButton.classList.remove("poll-option--voted");
});

teamBButton.addEventListener("click", () => {
  vote(ApiEndpoint.VoteTeamB, "Team B");
  teamBButton.classList.add("poll-option--voted");
teamAButton.classList.remove("poll-option--voted");
});
function startCountdown(gameTime: string) {
  function updateCountdown() {
    const target = new Date(gameTime).getTime();
    const now = Date.now();

    const diff = target - now;

if (diff <= 0) {
  countdownEl.textContent = "🔒 Locked";
  teamAButton.disabled = true;
  teamBButton.disabled = true;
  teamAButton.classList.add("poll-option--locked");
  teamBButton.classList.add("poll-option--locked");
  return;
}

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(
      (diff % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor(
      (diff % (1000 * 60)) / 1000
    );

    countdownEl.textContent =
      `🕒 ${hours.toString().padStart(2, "0")}:` +
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}`;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}