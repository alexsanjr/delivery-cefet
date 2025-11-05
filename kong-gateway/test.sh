#!/bin/sh

echo ""
echo "1. Status do Kong:"
curl -s http://localhost:8001/status | jq .

echo ""
echo "2. Serviços:"
curl -s http://localhost:8001/services | jq '.data[] | {name: .name, url: .url}'

echo ""
echo "3. Rotas:"
curl -s http://localhost:8001/routes | jq '.data[] | {name: .name, paths: .paths}'

echo ""
echo "4. Plugins:"
curl -s http://localhost:8001/plugins | jq '.data[] | {name: .name}'

echo ""
echo "5. Consumers:"
curl -s http://localhost:8001/consumers | jq '.data[] | {username: .username}'

echo ""
echo "6. Gerando token JWT (web-app-issuer):"
JWT=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {iss: 'web-app-issuer', sub: 'test', exp: Math.floor(Date.now()/1000)+3600},
  'condense-aerospace-percolate-prelaunch-skylight-surely'
);
console.log(token);
")
echo $JWT

echo ""
echo "7. Testando requisicao sem token:"
curl -s -X POST http://localhost:8000/orders/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | jq .

echo ""
echo "8. Testando requisicao com token:"
curl -s -X POST http://localhost:8000/orders/graphql \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | jq .
