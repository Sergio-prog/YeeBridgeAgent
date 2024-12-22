import logging
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from src.stores import chat_manager_instance, agent_manager_instance

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bridge", tags=["bridge"])


@router.post("/tx_status")
async def tx_status(request: Request):
    """Check transaction status"""
    logger.info("Received tx_status request")
    try:
        bridge_agent = agent_manager_instance.get_agent("crypto bridge")
        if not bridge_agent:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Crypto bridge agent not found"},
            )

        response = await bridge_agent.tx_status(request)
        chat_manager_instance.add_message(response)
        return response
    except Exception as e:
        logger.error(f"Failed to check tx status: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to check tx status: {str(e)}"},
        )


@router.post("/allowance")
async def allowance(request: Request):
    """Get token allowance"""
    logger.info("Received allowance request")
    try:
        bridge_agent = agent_manager_instance.get_agent("crypto bridge")
        if not bridge_agent:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Crypto bridge agent not found"},
            )

        response = await bridge_agent.get_allowance(request)
        return response
    except Exception as e:
        logger.error(f"Failed to get allowance: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to get allowance: {str(e)}"},
        )


@router.post("/approve")
async def approve(request: Request):
    """Approve token spending"""
    logger.info("Received approve request")
    try:
        bridge_agent = agent_manager_instance.get_agent("crypto bridge")
        if not bridge_agent:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Crypto bridge agent not found"},
            )

        response = await bridge_agent.approve(request)
        return response
    except Exception as e:
        logger.error(f"Failed to approve: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to approve: {str(e)}"},
        )


@router.post("/bridge")
async def bridge(request: Request):
    """Execute token bridge"""
    logger.info("Received bridge request")
    try:
        bridge_agent = agent_manager_instance.get_agent("crypto bridge")
        if not bridge_agent:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Crypto bridge agent not found"},
            )

        response = await bridge_agent.bridge(request)
        return response
    except Exception as e:
        logger.error(f"Failed to bridge: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Failed to bridge: {str(e)}"},
        )
