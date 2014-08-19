package com.typesafe.sbt.sweet

import sbt._
import sbt.Keys._
import com.typesafe.sbt.web._
import com.typesafe.sbt.jse.SbtJsTask
import spray.json._

object Import {

  object SweetKeys {
    val sweet = TaskKey[Seq[File]]("sweet", "Invoke the sweet compiler.")
  }

}

object SbtSweet extends AutoPlugin {

  override def requires = SbtJsTask

  override def trigger = AllRequirements

  val autoImport = Import

  import SbtWeb.autoImport._
  import WebKeys._
  import SbtJsTask.autoImport.JsTaskKeys._
  import autoImport.SweetKeys._

  val sweetUnscopedSettings = Seq(
    includeFilter := GlobFilter("*.sjs")
  )

  override def projectSettings = Seq(
  ) ++ inTask(sweet)(
    SbtJsTask.jsTaskSpecificUnscopedSettings ++
      inConfig(Assets)(sweetUnscopedSettings) ++
      inConfig(TestAssets)(sweetUnscopedSettings) ++
      Seq(
        moduleName := "sweet",
        shellFile := getClass.getClassLoader.getResource("sweet-shell.js"),

        taskMessage in Assets := "Sweet compiling",
        taskMessage in TestAssets := "Sweet test compiling"
      )
  ) ++ SbtJsTask.addJsSourceFileTasks(sweet) ++ Seq(
    sweet in Assets := (sweet in Assets).dependsOn(webModules in Assets).value,
    sweet in TestAssets := (sweet in TestAssets).dependsOn(webModules in TestAssets).value
  )

}