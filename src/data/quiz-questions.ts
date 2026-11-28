// Questions for /lab/quiz. Each question lists the correct choice first; the page shuffles them.

export type QuizDeck = 'http' | 'git';

export interface QuizQuestion {
  deck: QuizDeck;
  prompt: string;
  /** choices[0] is the correct one. */
  choices: [string, string, string, string];
  why: string;
}

export const QUIZ_DECKS: ReadonlyArray<{ id: QuizDeck; label: string; blurb: string }> = [
  { id: 'http', label: 'HTTP status codes', blurb: 'Which code fits the situation?' },
  { id: 'git', label: 'Git commands', blurb: 'Which command does the job?' },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── HTTP ──────────────────────────────────────────────────────────────────
  {
    deck: 'http',
    prompt: 'The request body is not valid JSON, so the server cannot even parse it.',
    choices: ['400 Bad Request', '401 Unauthorized', '404 Not Found', '500 Internal Server Error'],
    why: 'The client sent something the server cannot parse. That is the client\'s fault, so it is a 4xx, and 400 is the generic "malformed request" code.',
  },
  {
    deck: 'http',
    prompt: 'There is no token on the request, but the endpoint requires you to be logged in.',
    choices: ['401 Unauthorized', '403 Forbidden', '400 Bad Request', '404 Not Found'],
    why: '401 means "I do not know who you are": credentials are missing or invalid.',
  },
  {
    deck: 'http',
    prompt: 'A signed-in user without admin rights calls an admin-only endpoint.',
    choices: ['403 Forbidden', '401 Unauthorized', '404 Not Found', '409 Conflict'],
    why: 'The server knows who you are and refuses anyway. 403 is about permission, not identity.',
  },
  {
    deck: 'http',
    prompt: 'The URL does not match any resource on the server.',
    choices: ['404 Not Found', '410 Gone', '400 Bad Request', '405 Method Not Allowed'],
    why: '404 is the default answer for "nothing here". 410 is only for something that was removed on purpose.',
  },
  {
    deck: 'http',
    prompt: 'A page moved for good to a new address, and clients should update their links.',
    choices: ['301 Moved Permanently', '302 Found', '304 Not Modified', '410 Gone'],
    why: '301 is the permanent redirect, so browsers and search engines update. 302 is temporary.',
  },
  {
    deck: 'http',
    prompt: 'A page is temporarily served from another address, but the old URL stays the real one.',
    choices: ['302 Found', '301 Moved Permanently', '404 Not Found', '200 OK'],
    why: '302 is a temporary redirect: clients should keep using the original URL next time.',
  },
  {
    deck: 'http',
    prompt: 'A POST created a new order, and the server points to the new resource.',
    choices: ['201 Created', '200 OK', '202 Accepted', '204 No Content'],
    why: '201 says "something new now exists", usually with a Location header pointing to it.',
  },
  {
    deck: 'http',
    prompt: 'The server accepted a request to build a report, but the job runs in the background and is not finished.',
    choices: ['202 Accepted', '200 OK', '201 Created', '204 No Content'],
    why: '202 means the request was accepted for processing, but the work is not complete yet.',
  },
  {
    deck: 'http',
    prompt: 'A DELETE succeeded and there is nothing to send back.',
    choices: ['204 No Content', '200 OK', '404 Not Found', '202 Accepted'],
    why: '204 is success with an empty body.',
  },
  {
    deck: 'http',
    prompt: 'The browser sends If-None-Match with a cached ETag, and the resource has not changed.',
    choices: ['304 Not Modified', '200 OK', '204 No Content', '412 Precondition Failed'],
    why: '304 tells the client to reuse its cached copy, so no body is sent.',
  },
  {
    deck: 'http',
    prompt: 'A client sent too many requests in a minute and is being throttled.',
    choices: ['429 Too Many Requests', '403 Forbidden', '503 Service Unavailable', '408 Request Timeout'],
    why: '429 is the rate-limit code, often with a Retry-After header.',
  },
  {
    deck: 'http',
    prompt: 'An unhandled exception crashed the request handler on the server.',
    choices: ['500 Internal Server Error', '400 Bad Request', '502 Bad Gateway', '503 Service Unavailable'],
    why: '500 is the catch-all for "the server broke while handling a valid request".',
  },
  {
    deck: 'http',
    prompt: 'A reverse proxy got an invalid response from the application server behind it.',
    choices: ['502 Bad Gateway', '500 Internal Server Error', '503 Service Unavailable', '504 Gateway Timeout'],
    why: '502 means a gateway or proxy received a bad answer from the upstream server.',
  },
  {
    deck: 'http',
    prompt: 'The service is down for maintenance and will be back soon.',
    choices: ['503 Service Unavailable', '500 Internal Server Error', '502 Bad Gateway', '504 Gateway Timeout'],
    why: '503 means the server cannot handle requests right now, usually temporarily.',
  },
  {
    deck: 'http',
    prompt: 'A proxy waited too long for the upstream server to answer.',
    choices: ['504 Gateway Timeout', '502 Bad Gateway', '408 Request Timeout', '503 Service Unavailable'],
    why: '504 is a timeout seen by a gateway. 408 is the server giving up waiting for the client.',
  },
  {
    deck: 'http',
    prompt: 'A POST was sent to a route that only supports GET.',
    choices: ['405 Method Not Allowed', '400 Bad Request', '404 Not Found', '415 Unsupported Media Type'],
    why: '405 means the route exists but not for that HTTP method, and the response lists the allowed ones.',
  },
  {
    deck: 'http',
    prompt: 'An article was deleted on purpose and will not come back.',
    choices: ['410 Gone', '404 Not Found', '301 Moved Permanently', '403 Forbidden'],
    why: '410 says the resource existed, is gone for good, and no forwarding address is known.',
  },
  {
    deck: 'http',
    prompt: 'Someone registers a username that already exists.',
    choices: ['409 Conflict', '400 Bad Request', '500 Internal Server Error', '404 Not Found'],
    why: '409 signals that the request conflicts with the current state of the resource. (Some APIs use 422 for this.)',
  },
  {
    deck: 'http',
    prompt: 'The uploaded file is larger than the server allows.',
    choices: ['413 Content Too Large', '400 Bad Request', '415 Unsupported Media Type', '431 Request Header Fields Too Large'],
    why: '413 (formerly "Payload Too Large") means the request body exceeds what the server will accept.',
  },
  {
    deck: 'http',
    prompt: 'The client sent XML, but the endpoint only accepts JSON.',
    choices: ['415 Unsupported Media Type', '406 Not Acceptable', '400 Bad Request', '422 Unprocessable Content'],
    why: '415 is about the format of what the client sent (Content-Type).',
  },
  {
    deck: 'http',
    prompt: 'The Accept header asks for a format the server cannot produce.',
    choices: ['406 Not Acceptable', '415 Unsupported Media Type', '400 Bad Request', '404 Not Found'],
    why: '406 is about the format the client wants back (Accept). Do not confuse it with 415.',
  },
  {
    deck: 'http',
    prompt: 'The JSON is valid and parsed, but the age field is -5 and fails validation.',
    choices: ['422 Unprocessable Content', '400 Bad Request', '409 Conflict', '500 Internal Server Error'],
    why: '422 means the syntax is fine but the content cannot be processed. Many APIs also use 400 for this.',
  },
  {
    deck: 'http',
    prompt: 'A WebSocket handshake succeeds and the connection switches protocol.',
    choices: ['101 Switching Protocols', '100 Continue', '200 OK', '426 Upgrade Required'],
    why: '101 confirms the server agrees to switch to the protocol requested in the Upgrade header.',
  },

  // ── Git ───────────────────────────────────────────────────────────────────
  {
    deck: 'git',
    prompt: 'Undo your last commit but keep its changes staged.',
    choices: ['git reset --soft HEAD~1', 'git reset --hard HEAD~1', 'git revert HEAD', 'git checkout HEAD~1'],
    why: '--soft moves the branch back and leaves the index and working tree untouched. --hard would throw the changes away.',
  },
  {
    deck: 'git',
    prompt: 'Undo your last commit but keep its changes in the working tree, unstaged.',
    choices: ['git reset HEAD~1', 'git reset --soft HEAD~1', 'git reset --hard HEAD~1', 'git stash'],
    why: 'A plain git reset is --mixed: it moves the branch back and unstages, but keeps your edits.',
  },
  {
    deck: 'git',
    prompt: 'Add a new commit that cancels an already pushed commit.',
    choices: ['git revert <sha>', 'git reset --hard <sha>', 'git rebase -i <sha>', 'git cherry-pick <sha>'],
    why: 'revert adds a new commit instead of rewriting history, which is why it is safe on shared branches.',
  },
  {
    deck: 'git',
    prompt: 'See who last changed each line of a file.',
    choices: ['git blame file', 'git log file', 'git diff file', 'git show file'],
    why: 'blame annotates every line with the commit and author that last touched it.',
  },
  {
    deck: 'git',
    prompt: 'Park uncommitted work so you can switch branches cleanly.',
    choices: ['git stash', 'git reset', 'git clean', 'git commit --amend'],
    why: 'stash saves your modifications on a stack and restores a clean working tree.',
  },
  {
    deck: 'git',
    prompt: 'Copy one specific commit from another branch onto yours.',
    choices: ['git cherry-pick <sha>', 'git rebase <sha>', 'git revert <sha>', 'git checkout <sha>'],
    why: 'cherry-pick replays a single commit on top of the current branch.',
  },
  {
    deck: 'git',
    prompt: 'Find the commit that introduced a bug by binary search.',
    choices: ['git bisect', 'git blame', 'git grep', 'git shortlog'],
    why: 'bisect halves the range of commits each time you mark one good or bad.',
  },
  {
    deck: 'git',
    prompt: 'Recover a commit after a bad reset by looking at where HEAD used to be.',
    choices: ['git reflog', 'git log', 'git status', 'git stash list'],
    why: 'The reflog records every move of HEAD, so lost commits can still be found and restored.',
  },
  {
    deck: 'git',
    prompt: 'Delete a local branch that has already been merged.',
    choices: ['git branch -d feature', 'git checkout -d feature', 'git rm feature', 'git reset feature'],
    why: 'branch -d refuses to delete a branch that is not fully merged. Use -D to force it.',
  },
  {
    deck: 'git',
    prompt: 'Download new commits from the remote without touching your working branch.',
    choices: ['git fetch', 'git pull', 'git push', 'git clone'],
    why: 'fetch only updates your remote-tracking branches. pull is fetch plus a merge or rebase.',
  },
  {
    deck: 'git',
    prompt: 'Replay your feature branch commits on top of the latest main.',
    choices: ['git rebase main', 'git cherry-pick main', 'git reset main', 'git revert main'],
    why: 'rebase re-applies your commits one by one on the new base, giving a linear history.',
  },
  {
    deck: 'git',
    prompt: 'Reorder, squash or edit the last three commits interactively.',
    choices: ['git rebase -i HEAD~3', 'git revert HEAD~3', 'git cherry-pick HEAD~3', 'git log --graph -3'],
    why: 'An interactive rebase opens a todo list where each commit can be picked, squashed, reworded or dropped.',
  },
  {
    deck: 'git',
    prompt: 'Stage only some of the changes inside a file.',
    choices: ['git add -p', 'git add .', 'git restore --staged .', 'git commit -a'],
    why: 'add -p walks through each hunk and asks whether to stage it.',
  },
  {
    deck: 'git',
    prompt: 'Throw away your unstaged edits to one file (modern command).',
    choices: ['git restore file', 'git rm file', 'git clean -f', 'git reset --soft'],
    why: 'restore puts the file back to the staged (or committed) version. Use it carefully: the edits are gone.',
  },
  {
    deck: 'git',
    prompt: 'Create a branch and switch to it in one command (modern syntax).',
    choices: ['git switch -c new-branch', 'git branch new-branch', 'git checkout new-branch', 'git merge new-branch'],
    why: 'switch -c creates and switches. branch alone only creates, and checkout without -b only switches.',
  },
  {
    deck: 'git',
    prompt: 'Force-push, but refuse if someone else pushed new commits.',
    choices: ['git push --force-with-lease', 'git push --force', 'git push --no-verify', 'git push --mirror'],
    why: '--force-with-lease checks that the remote is still where you last saw it before overwriting.',
  },
  {
    deck: 'git',
    prompt: 'Show the changes you have staged, ready for the next commit.',
    choices: ['git diff --staged', 'git diff', 'git status', 'git log -p'],
    why: 'A plain git diff shows unstaged changes. --staged (or --cached) shows what is in the index.',
  },
  {
    deck: 'git',
    prompt: 'Check out a second branch in another folder without cloning again.',
    choices: ['git worktree add', 'git submodule add', 'git stash apply', 'git switch'],
    why: 'A worktree is a second working directory that shares the same repository.',
  },
  {
    deck: 'git',
    prompt: 'Remove untracked files and folders from the working tree.',
    choices: ['git clean -fd', 'git reset --hard', 'git rm -r .', 'git stash drop'],
    why: 'clean deletes untracked files. reset --hard leaves untracked files alone.',
  },
  {
    deck: 'git',
    prompt: 'Fix the message of the commit you just made (not pushed yet).',
    choices: ['git commit --amend', 'git revert HEAD', 'git reset --hard', 'git rebase --abort'],
    why: 'amend replaces the last commit, so only do it before the commit is shared.',
  },
  {
    deck: 'git',
    prompt: 'Print a compact history with a branch graph.',
    choices: ['git log --oneline --graph', 'git show --stat', 'git reflog', 'git blame'],
    why: '--oneline gives one line per commit and --graph draws the branch structure.',
  },
  {
    deck: 'git',
    prompt: 'Mark the current commit as release v1.0 with a message.',
    choices: ["git tag -a v1.0 -m 'Release 1.0'", 'git branch v1.0', 'git commit -m v1.0', 'git stash save v1.0'],
    why: 'An annotated tag (-a) stores a message, author and date, which suits releases.',
  },
];
