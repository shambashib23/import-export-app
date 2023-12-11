

class ApiResponse {
  constructor(res, statusCode, message, data, tokens) {
    let respObj = {};
    respObj.code = statusCode || 200;
    respObj.message = message || 'success';
    respObj.isSuccess = true;
    respObj.data = data || {};
    if (tokens) {
      respObj.accessToken = tokens.access.token;
      respObj.refreshToken = tokens.refresh.token;
    }
    res.status(statusCode || 200).json(respObj);
  }
}
module.exports = ApiResponse;
