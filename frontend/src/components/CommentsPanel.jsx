import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faHeart,
  faPaperPlane,
  faFrown,
  faUser,
  faEllipsisV,
  faReply,
  faThumbsUp,
  faSmile,
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";
import Input from "./Input";
import catalogService from "../services/catalogService";

const CommentsPanel = ({ video, isOpen, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  // Cargar comentarios reales desde la API
  useEffect(() => {
    if (isOpen && video) {
      loadComments();
    }
  }, [isOpen, video]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const commentsData = await catalogService.getComments(video.id);
      setComments(commentsData);
    } catch (error) {
      console.error("Error loading comments:", error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const newCommentData = await catalogService.createComment(
        video.id,
        newComment,
        replyTo
      );

      if (replyTo) {
        // Agregar como respuesta
        const updatedComments = comments.map((c) => {
          if (c.id === replyTo) {
            return {
              ...c,
              respuestas: [...(c.respuestas || []), newCommentData],
            };
          }
          return c;
        });
        setComments(updatedComments);
        setReplyTo(null);
      } else {
        // Agregar como comentario nuevo
        setComments([newCommentData, ...comments]);
      }

      // Emitir evento para actualizar contador en el catálogo
      if (newCommentData.total_comentarios !== undefined) {
        window.dispatchEvent(
          new CustomEvent("commentAdded", {
            detail: {
              videoId: video.id,
              totalComments: newCommentData.total_comentarios,
            },
          })
        );
      }

      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
      if (error.message.includes("iniciar sesión")) {
        alert(
          "Debes iniciar sesión para comentar. Por favor inicia sesión y vuelve a intentar."
        );
      } else {
        alert("Error al enviar el comentario. Por favor intenta nuevamente.");
      }
    }
  };

  const handleLikeComment = async (
    commentId,
    isReply = false,
    parentId = null
  ) => {
    try {
      const result = await catalogService.toggleCommentLike(commentId);

      if (isReply) {
        const updatedComments = comments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              respuestas: comment.respuestas.map((reply) => {
                if (reply.id === commentId) {
                  return {
                    ...reply,
                    usuario_ha_dado_like: result.liked,
                    total_likes: result.total_likes,
                  };
                }
                return reply;
              }),
            };
          }
          return comment;
        });
        setComments(updatedComments);
      } else {
        const updatedComments = comments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              usuario_ha_dado_like: result.liked,
              total_likes: result.total_likes,
            };
          }
          return comment;
        });
        setComments(updatedComments);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      if (error.message.includes("iniciar sesión")) {
        alert(
          "Debes iniciar sesión para dar like. Por favor inicia sesión y vuelve a intentar."
        );
      }
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now - commentDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "ahora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const CommentItem = ({ comment, isReply = false, parentId = null }) => (
    <div className={`${isReply ? "ml-8 mt-3" : "mb-6"}`}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.usuario_avatar ? (
            <img
              src={comment.usuario_avatar}
              alt={comment.usuario_nombre || comment.usuario_username}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {getInitials(
                  comment.usuario_nombre || comment.usuario_username
                )}
              </span>
            </div>
          )}
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {comment.usuario_nombre || comment.usuario_username}
              </h4>
              <button className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faEllipsisV} className="text-xs" />
              </button>
            </div>
            <p className="text-sm text-gray-800">{comment.texto}</p>
          </div>

          {/* Comment actions */}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span>
              {formatTimeAgo(comment.fecha_creacion || comment.fecha)}
            </span>
            <button
              onClick={() => handleLikeComment(comment.id, isReply, parentId)}
              className={`flex items-center space-x-1 hover:text-red-500 ${
                comment.usuario_ha_dado_like ? "text-red-500" : ""
              }`}
            >
              <FontAwesomeIcon icon={faThumbsUp} />
              <span>{comment.total_likes || 0}</span>
            </button>
            {!isReply && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="hover:text-blue-500"
              >
                <FontAwesomeIcon icon={faReply} className="mr-1" />
                Responder
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.respuestas && comment.respuestas.length > 0 && (
            <div className="mt-3">
              {comment.respuestas.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply={true}
                  parentId={comment.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const EmptyComments = () => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <FontAwesomeIcon icon={faFrown} className="text-6xl mb-4" />
      <h3 className="text-lg font-medium text-gray-600 mb-2">
        Aún no hay comentarios
      </h3>
      <p className="text-sm text-center max-w-xs">
        Sé el primero en comentar este video y comparte tu opinión con otros
        estudiantes.
      </p>
      <div className="mt-4">
        <FontAwesomeIcon icon={faSmile} className="text-2xl text-gray-300" />
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Comentarios</h2>
            <p className="text-sm text-gray-600">
              {comments.length > 0
                ? `${comments.length} comentario${
                    comments.length !== 1 ? "s" : ""
                  }`
                : "Sin comentarios"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>

        {/* Video info */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
            {video.titulo}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {video.categoria_nombre} • {video.visualizaciones} visualizaciones
          </p>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <EmptyComments />
          ) : (
            <div className="p-4">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>

        {/* Comment input */}
        <div className="border-t bg-white p-4 sticky bottom-0">
          {replyTo && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg text-sm">
              <span className="text-blue-600">
                Respondiendo a {comments.find((c) => c.id === replyTo)?.usuario}
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="text-white text-xs" />
              </div>
            </div>
            <div className="flex-1">
              <Input
                type="text"
                placeholder={
                  replyTo
                    ? "Escribe una respuesta..."
                    : "Agrega un comentario..."
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button
              type="submit"
              disabled={!newComment.trim()}
              className="rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentsPanel;
