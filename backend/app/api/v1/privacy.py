from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import (
    User, UserPrivacyPreference, Conversation, GeneratedDocument,
    UserFeedback, AuditLog
)
from app.schemas import (
    UserPrivacyPreferenceResponse, UserPrivacyPreferenceUpdate,
    UserExportDataResponse, UserResponse
)
from app.api.deps import get_current_user, check_rate_limit

router = APIRouter(prefix="/privacy", tags=["Privacy & Security Controls"], dependencies=[Depends(check_rate_limit)])


@router.get("/preferences", response_model=UserPrivacyPreferenceResponse)
def get_privacy_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's consent and retention preferences."""
    pref = db.query(UserPrivacyPreference).filter(UserPrivacyPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPrivacyPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.put("/preferences", response_model=UserPrivacyPreferenceResponse)
def update_privacy_preferences(
    pref_update: UserPrivacyPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update consent for retention, personalization, or retention days."""
    pref = db.query(UserPrivacyPreference).filter(UserPrivacyPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPrivacyPreference(user_id=current_user.id)
        db.add(pref)

    if pref_update.consent_data_retention is not None:
        pref.consent_data_retention = pref_update.consent_data_retention
    if pref_update.consent_personalization is not None:
        pref.consent_personalization = pref_update.consent_personalization
    if pref_update.analytics_opt_in is not None:
        pref.analytics_opt_in = pref_update.analytics_opt_in
    if pref_update.retention_days is not None:
        pref.retention_days = pref_update.retention_days

    pref.updated_at = datetime.now(timezone.utc)
    db.add(pref)

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE_PRIVACY_PREFERENCES",
        resource_type="UserPrivacyPreference",
        resource_id=pref.id,
        details_json={"retention_days": pref.retention_days}
    )
    db.add(audit)
    db.commit()
    db.refresh(pref)
    return pref


@router.get("/export", response_model=UserExportDataResponse)
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    GDPR Article 20 / DPDP Act compliant personal data export.
    Returns complete portable JSON bundle of all profile info, conversations, and drafts.
    """
    pref = db.query(UserPrivacyPreference).filter(UserPrivacyPreference.user_id == current_user.id).first()
    conversations = db.query(Conversation).filter(Conversation.user_id == current_user.id).all()
    drafts = db.query(GeneratedDocument).filter(GeneratedDocument.user_id == current_user.id).all()
    feedback = db.query(UserFeedback).filter(UserFeedback.user_id == current_user.id).all()

    conv_list = []
    for c in conversations:
        conv_list.append({
            "id": c.id,
            "title": c.title,
            "topic": c.topic,
            "jurisdiction": c.jurisdiction,
            "created_at": c.created_at.isoformat(),
            "messages_count": len(c.messages),
            "messages": [
                {
                    "sender": m.sender,
                    "content": m.content,
                    "created_at": m.created_at.isoformat(),
                    "citations_count": len(m.citations)
                }
                for m in c.messages
            ]
        })

    draft_list = [
        {
            "id": d.id,
            "title": d.title,
            "document_type": d.document_type,
            "status": d.status,
            "created_at": d.created_at.isoformat(),
            "input_data": d.input_data_json
        }
        for d in drafts
    ]

    feedback_list = [
        {
            "id": f.id,
            "is_helpful": f.is_helpful,
            "rating": f.rating,
            "comments": f.comments,
            "created_at": f.created_at.isoformat()
        }
        for f in feedback
    ]

    audit = AuditLog(
        user_id=current_user.id,
        action="EXPORT_PERSONAL_DATA",
        resource_type="User",
        resource_id=current_user.id,
        details_json={"format": "JSON"}
    )
    db.add(audit)
    db.commit()

    return UserExportDataResponse(
        user_profile=UserResponse.model_validate(current_user),
        privacy_preferences=UserPrivacyPreferenceResponse.model_validate(pref) if pref else None,
        conversations=conv_list,
        generated_documents=draft_list,
        feedback_submissions=feedback_list,
        exported_at=datetime.now(timezone.utc)
    )


@router.delete("/clear-history")
def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete all chat conversations and messages for the user."""
    convs = db.query(Conversation).filter(Conversation.user_id == current_user.id).all()
    count = len(convs)
    for c in convs:
        db.delete(c)

    audit = AuditLog(
        user_id=current_user.id,
        action="CLEAR_CHAT_HISTORY",
        resource_type="Conversation",
        details_json={"deleted_conversations_count": count}
    )
    db.add(audit)
    db.commit()
    return {"message": f"Successfully deleted {count} conversations."}


@router.delete("/delete-account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Right to be Forgotten: Permanently deletes user account and all cascaded data
    (conversations, messages, drafts, feedback, preferences).
    """
    user_id = current_user.id
    email = current_user.email

    audit = AuditLog(
        user_id=None,
        action="ACCOUNT_DELETED",
        resource_type="User",
        resource_id=user_id,
        details_json={"email": email}
    )
    db.add(audit)
    db.delete(current_user)
    db.commit()

    return {"message": "Account and all associated personal data have been permanently deleted."}
