#!/bin/bash

# 计算一年前的日期
one_year_ago=$(date -v-1y +%Y-%m-%d)

# 获取所有分支列表
branches=$(git branch -r --format='%(refname:short)')

# 遍历每个分支
for branch in $branches; do
  # 获取分支的最后提交日期
  last_commit_date=$(git log -1 --format="%ad" --date=short $branch)

  # 比较最后提交日期和一年前的日期
  if [[ $last_commit_date < $one_year_ago ]]; then
    # 删除分支
    git push origin --delete $branch
    echo "已删除分支: $branch"
  fi
done
