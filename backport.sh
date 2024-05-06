git reset HEAD~1
rm ./backport.sh
git cherry-pick 1a5d9e82fc144dc0cc3e95e16b9749c24e5e49d0
echo 'Resolve conflicts and force push this branch'
