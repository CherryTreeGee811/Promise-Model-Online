#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# === Step 1: Check prerequisites ===
for cmd in virsh virt-install qemu-img xorrisofs ansible rsync; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "FATAL: $cmd not found — install it first"; exit 1; }
done

echo "[1/5] Checking libvirtd..."
systemctl is-active --quiet libvirtd || {
  echo "FATAL: libvirtd is not running. Start it: sudo systemctl enable --now libvirtd"
  exit 1
}

# === Step 2: Validate required secrets ===
echo "[2/5] Validating secrets..."
missing=0
for f in google_client_secret.txt sendgrid_api_key.txt cloudflare_tunnel_token.txt github_token.txt; do
  if [ ! -s "secrets/$f" ] || grep -q "REPLACE_ME\|PLACEHOLDER" "secrets/$f" 2>/dev/null; then
    echo "  FATAL: secrets/$f is missing or still has placeholder text"
    missing=1
  fi
done
[ "$missing" -eq 1 ] && exit 1

# === Step 3: Generate SSH key ===
echo "[3/5] Checking SSH key..."
if [ ! -f ~/.ssh/pmo_vm_key ]; then
  echo "  Generating ~/.ssh/pmo_vm_key..."
  ssh-keygen -t ed25519 -f ~/.ssh/pmo_vm_key -N "" >/dev/null 2>&1
fi

# === Step 4: Generate auto-secrets + certs ===
echo "[4/5] Generating passwords and certificates..."
bash scripts/generate-secrets.sh

# === Step 5: Deploy via Ansible ===
echo "[5/5] Deploying via Ansible (provision VM + deploy stack)..."
ansible-playbook -i ansible/inventory/hosts.yml ansible/playbooks/site.yml

echo ""
echo "Done. VM should be reachable at 192.168.122.50"
echo "  ssh pmo_admin@192.168.122.50 -i ~/.ssh/pmo_vm_key"
echo "  docker service ls --filter name=promisemodelonline"
