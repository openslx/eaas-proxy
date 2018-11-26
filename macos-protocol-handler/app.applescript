#!/usr/bin/osascript

on open location u
  do shell script (quoted form of (posix path of (path to resource "app"))) & " " & (quoted form of u)
end

do shell script (quoted form of (posix path of (path to resource "app")))
