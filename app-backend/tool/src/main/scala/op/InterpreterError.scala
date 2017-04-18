package com.azavea.rf.tool.op

import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.data._

import java.net.URI
import java.util.UUID


sealed trait InterpreterError {
  val id: UUID
  def repr: String
}
case class MissingParameter(id: UUID) extends InterpreterError {
  def repr = s"Unbound parameter encountered, unable to evaluate"
}
case class RasterRetrievalError(id: UUID, refId: UUID) extends InterpreterError {
  def repr = s"Unable to retrieve raster for $refId"
}

object InterpreterError {
  implicit val encodeInterpreterErrors: Encoder[InterpreterError] =
    new Encoder[InterpreterError] {
      final def apply(err: InterpreterError): Json = JsonObject.fromMap {
        Map("node" -> err.id.asJson, "reason" -> err.repr.asJson)
      }.asJson
    }
}

case class InterpreterException(errs: NonEmptyList[InterpreterError]) extends Exception

object InterpreterException {
  implicit val encodeErrorList: Encoder[InterpreterException] =
    new Encoder[InterpreterException] {
      final def apply(exception: InterpreterException): Json = JsonObject.fromMap {
        Map("Errors" -> exception.errs.toList.asJson)
      }.asJson
    }
}

