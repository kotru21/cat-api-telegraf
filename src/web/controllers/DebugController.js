export class DebugController {
  getDebugInfo = (req, res) => {
    res.json({
      sessionExists: !!req.session,
      sessionID: req.sessionID,
      sessionUser: req.session.user,
      cookieSettings: req.session.cookie,
      headers: req.headers,
      secure: req.secure,
    });
  };
}
