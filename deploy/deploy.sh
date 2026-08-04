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

echo "  Checking default network..."
virsh -c qemu:///system net-info default 2>/dev/null | grep 'Active.*yes' >/dev/null || {
  echo "FATAL: Default libvirt network is not active."
  echo "  Define and start it:"
  echo "    sudo cat /etc/libvirt/qemu/networks/default.xml \\"
  echo "      | virsh -c qemu:///system net-define /dev/stdin \\"
  echo "      && virsh -c qemu:///system net-start default \\"
  echo "      && virsh -c qemu:///system net-autostart default"
  exit 1
}

# === Step 2: Generate SSH key ===
echo "[2/5] Checking SSH key..."
if [ ! -f ~/.ssh/pmo_vm_key ]; then
  echo "  Generating ~/.ssh/pmo_vm_key..."
  ssh-keygen -t ed25519 -f ~/.ssh/pmo_vm_key -N "" >/dev/null 2>&1
fi

# === Step 3: Generate auto-secrets, certs, and placeholders ===
echo "[3/5] Generating passwords and certificates..."
bash scripts/generate-secrets.sh

# === Step 4: Validate external secrets ===
echo "[4/5] Checking external secrets..."
missing=0
for f in google_client_secret.txt sendgrid_api_key.txt cloudflare_tunnel_token.txt github_token.txt; do
  if grep -q "REPLACE_ME\|PLACEHOLDER" "secrets/$f" 2>/dev/null; then
    echo "  ⚠️  secrets/$f still has placeholder — replace with your real value"
    missing=1
  fi
done

if [ "$missing" -eq 1 ]; then
  echo ""
  echo "⚠️  WARNING: One or more external secrets have placeholder values."
  echo "   Affected services (Google auth, SendGrid email, GitHub issues) will fail."
  echo "   Edit deploy/secrets/*.txt with real values and re-run to fix."
  echo "   Continuing with placeholder secrets..."
fi

# === Step 5: Deploy via Ansible ===
echo "[5/5] Deploying via Ansible (provision VM + deploy stack)..."
ansible-playbook -i ansible/inventory/hosts.yml ansible/playbooks/site.yml

echo ""
echo "Done. VM should be reachable at 192.168.122.50"
echo ""
echo "  ssh pmo_admin@192.168.122.50 -i ~/.ssh/pmo_vm_key"
echo "  docker service ls --filter name=promisemodelonline"
echo ""
echo "The Quick Tunnel URL is printed in the Ansible output above."
echo "Look for: https://<random>.trycloudflare.com"
