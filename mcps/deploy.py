import vertexai
from google.adk.agents import llm_agent
from google.adk.sessions import vertex_ai_session_service
from vertexai.preview.reasoning_engines import AdkApp
from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
from google.adk.tools import agent_tool
from google.adk.tools.google_search_tool import GoogleSearchTool
from google.adk.tools import url_context

PROJECT = "project-38c8b171"
LOCATION = "us-west1"

vertexai.init(project=PROJECT, location=LOCATION)

VertexAiSessionService = vertex_ai_session_service.VertexAiSessionService

my_agent_google_search_agent = llm_agent.LlmAgent(
    name='My_Agent_google_search_agent',
    model='gemini-2.5-pro',
    description='Agent specialized in performing Google searches.',
    sub_agents=[],
    instruction='Use the GoogleSearchTool to find information on the web.',
    tools=[GoogleSearchTool()],
)

my_agent_url_context_agent = llm_agent.LlmAgent(
    name='My_Agent_url_context_agent',
    model='gemini-2.5-pro',
    description='Agent specialized in fetching content from URLs.',
    sub_agents=[],
    instruction='Use the UrlContextTool to retrieve content from provided URLs.',
    tools=[url_context],
)

root_agent = llm_agent.LlmAgent(
    name='My_Agent',
    model='gemini-2.5-pro',
    description='helper with flight, hotels',
    sub_agents=[],
    instruction="""You are a precise travel assistant. Your goal is to use the provided tools to find 5 travel options, you can search on google. For each of the 5 combinations, return exactly this JSON structure WITHOUT ANY OTHER TEXT ONLY JSON even if you cannot find flight or housing:
            {
            "travel_options": [
                {
                "option_id": 1,
                "category": "Budget",
                "flight": {
                    "summary": "Route, Airline, Times, Price or Unknown",
                    "departure_time": "YYYY-MM-DDTHH:MM:SS",
                    "arrival_time": "YYYY-MM-DDTHH:MM:SS",
                    "booking_link": "URL"
                },
                "hotel": {
                    "name": "Hotel Name",
                    "description": "Location, rating, price/night",
                    "activities": "Search for 3 activities near by and write them here in a few words",
                    "check_in_date": "YYYY-MM-DD",
                    "check_out_date": "YYYY-MM-DD",
                    "booking_link": "URL"
                },
                "total_estimated_cost": "Price in EUR"
                }
            ]
            }

            Link Construction Rules (STRICT):
            1. flight.booking_link: https://www.google.com/travel/flights?q=Flights+to+[Destination]+from+[Origin]+on+[DepartureDate]+returning+[ReturnDate]
            2. hotel.booking_link: https://www.booking.com/searchresults.html?ss=[HotelName]&checkin=[CheckInDate]&checkout=[CheckOutDate]&group_adults=1
            3. URL Formatting: 
            - Replace ALL spaces with '+'.
            - STRIP OUT all special characters (-, |, /, !, @, #) from the [HotelName] before inserting into the URL.
            - Use YYYY-MM-DD for all dates.
            4. Output Requirement: Return ONLY the raw JSON. No markdown code blocks, no preamble, no explanations.""", 
    tools=[
        agent_tool.AgentTool(agent=my_agent_google_search_agent),
        agent_tool.AgentTool(agent=my_agent_url_context_agent),
        McpToolset(
            connection_params=StreamableHTTPConnectionParams(
                url='https://llm-1035833352819.europe-west1.run.app/mcp',
            ),
        )
    ],
)

app = AdkApp(
    agent=root_agent,
    session_service_builder=lambda: VertexAiSessionService()
)

# Deploy
client = vertexai.Client(project=PROJECT, location=LOCATION)
remote_agent = client.agent_engines.create(
    agent=app,
    config={
        "requirements": [
            "google-cloud-aiplatform[adk,agent_engines]",
            "google-adk",
            "cloudpickle",
            "pydantic",
        ],
        "display_name": "My Agent",
        "staging_bucket": "gs://project-38c8b171-agent-staging",
    }
)

# print("Deployed! Resource name:", remote_agent.resource_name)
# print("Resource ID:", remote_agent.resource_name.split("/")[-1])

import vertexai

vertexai.init(project="project-38c8b171-74f0-49bd-bee", location="us-west1")
client = vertexai.Client(project="project-38c8b171-74f0-49bd-bee", location="us-west1")

for e in client.agent_engines.list():
    print(e.api_resource.name)
    print(e.api_resource.display_name)
    print("---")
