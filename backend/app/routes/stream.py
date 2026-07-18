"""
FlowSense - SSE Stream Endpoint
Streams real-time hospital state updates to connected clients.
"""

import json
import asyncio
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from ..services.state_manager import state_manager

router = APIRouter(tags=["Stream"])


async def _event_generator(queue: asyncio.Queue):
    """Yield SSE events from the subscriber queue."""
    try:
        while True:
            try:
                data = await asyncio.wait_for(queue.get(), timeout=60)
                # Send as a single multiplexed event
                yield {
                    "event": "update",
                    "data": json.dumps(data, default=str),
                }
            except asyncio.TimeoutError:
                # Send keepalive comment so connection doesn't drop
                yield {"comment": "keepalive"}
    except asyncio.CancelledError:
        pass


@router.get("/stream")
async def stream_updates():
    """
    SSE endpoint — pushes hospital state updates every 30 seconds.

    Event types:
      - "update": full state (status, prediction, timeline, recommendations, patients, staff, surgeries)
      - keepalive comment every 60s if no data
    """
    queue = state_manager.subscribe()

    async def generate():
        try:
            async for event in _event_generator(queue):
                yield event
        finally:
            state_manager.unsubscribe(queue)

    return EventSourceResponse(generate())
