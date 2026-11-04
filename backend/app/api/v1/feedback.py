from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import UserFeedback, Message, User
from app.schemas import UserFeedbackCreate, UserFeedbackResponse
from app.api.deps import get_current_user, sanitize_input, check_rate_limit

router = APIRouter(prefix="/feedback", tags=["User Feedback"], dependencies=[Depends(check_rate_limit)])


@router.post("", response_model=UserFeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    fb_in: UserFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit helpfulness rating and citation accuracy feedback on a chatbot message."""
    msg = db.query(Message).filter(Message.id == fb_in.message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    feedback = UserFeedback(
        user_id=current_user.id,
        message_id=fb_in.message_id,
        is_helpful=fb_in.is_helpful,
        rating=fb_in.rating,
        comments=sanitize_input(fb_in.comments) if fb_in.comments else None,
        citation_accurate=fb_in.citation_accurate
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
