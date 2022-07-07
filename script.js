const usernameInput = document.getElementById("username-input");
const lookupButton = document.getElementById("lookup-button");
const userStats = document.getElementById("user-stats");
const userTable = document.getElementById("user-table");
const userImage = document.getElementById("user-image");

lookupButton.addEventListener("click", () => {
  const attributeKeys = [
    "name",
    "company",
    "blog",
    "location",
    "email",
    "bio",
    "created_at",
  ];

  GitHubApi.getUser(usernameInput.value).then((user) => {
    if (user) {
      GitHubApi.getUserEvents(usernameInput.value).then((events) => {
        const groups = events.reduce((prev, curr) => {
          const eventType = curr.type;
          prev[eventType] = (prev[eventType] || 0) + 1;
          return prev;
        }, {});

        const data = Object.keys(groups).map((key) => {
          const count = groups[key];

          return {
            label: `${key} (${count})`,
            value: count,
          };
        });

        userImage.src = user.avatar_url;
        while (userTable.querySelectorAll("tr").length > 1) {
          userTable.removeChild(userTable.lastChild);
        }

        user.recent_events = data.length;

        Object.keys(user)
          .filter((key) => user[key] && attributeKeys.includes(key))
          .forEach((key) => {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            const td = document.createElement("td");

            th.innerText = key;
            td.innerText = user[key];

            tr.appendChild(th);
            tr.appendChild(td);
            userTable.appendChild(tr);
          });

        PieChart.renderPieChart(data);

        userStats.style.display = "";
      });
    } else {
      userStats.style.display = "none";
    }
  });
});

class PieChart {
  static renderPieChart(data) {
    const width = 600;
    const height = 600;
    const radius = width / 2;

    const pieArc = d3.arc().outerRadius(radius).innerRadius(0);

    const labelArc = d3.arc().outerRadius(radius).innerRadius(10);

    const pie = d3.pie().value((x) => x.value);

    const svg = d3
      .select("#svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pieChart = svg.selectAll("g").data(pie(data)).enter().append("g");

    pieChart
      .append("path")
      .attr("d", pieArc)
      .attr("fill", (_, i) => d3.schemeSet3[i]);

    pieChart
      .append("text")
      .attr("font-size", 12)
      .attr("transform", (x) => {
        const radians = (x.startAngle + x.endAngle) / 2;
        const degrees = (radians * 180) / Math.PI;
        const centroid = labelArc.centroid(x);
        return `translate(${centroid[0] / 2}, ${centroid[1] / 2}), rotate(${
          degrees - 90
        })`;
      })
      .text((d) => d.data.label.replace("Event", ""));
  }
}

class GitHubApi {
  static baseUrl = "https://api.github.com";

  static getUser(username) {
    return fetch(`${this.baseUrl}/users/${username}`).then((res) =>
      res.ok ? res.json() : null
    );
  }

  static getUserEvents(username) {
    return Promise.all(
      [1, 2, 3].map((page) => {
        return fetch(
          `${this.baseUrl}/users/${username}/events?${new URLSearchParams({
            per_page: "100",
            page: page.toString(),
          })}`
        ).then((res) => (res.ok ? res.json() : []));
      })
    ).then((events) => events.flat());
  }
}
