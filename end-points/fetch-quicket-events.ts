export async function fetchQuicketEvents({
  pageSize,
  page,
}: {
  pageSize: number;
  page: number;
}) {
  const apiKey = process.env.QUICKET_API_KEY;
  const apiURL = process.env.QUICKET_API;
  const userToken = process.env.QUICKET_USER_TOKEN;

  const url = `${apiURL}/events?pageSize=${pageSize}&page=${page}&api_key=${apiKey}`;
  console.log(`Fetching ${url}`);

  const response = await fetch(url, {
    method: "GET",
    // headers: {
    //   usertoken: userToken,
    // },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch events from Quicket API: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();
  return {
    events: data.results,
    totalPages: data.pages,
    currentPage: page,
  };
}
