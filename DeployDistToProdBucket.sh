aws --profile prod s3 sync ./dist \
  s3://farmmapping-site-prod \
  --delete