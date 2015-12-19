# lybica-agent

`lybica-agent` is a daemon service that can manage the connection with lybica-platform and task proceedings.

The main features of `lybica-agent` includes:

* connect to lybica-platform and sync with it
* fetch task from lybica-platform, and run the task
* forward task console output to end user

In technical point of view, it is a `socket.io` client service.
