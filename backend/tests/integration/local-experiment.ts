import { execFile, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { Duplex } from 'node:stream';
import { Pool } from 'pg';
import { databasePoolConfig } from '../../src/repositories/database.js';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Wait } from 'testcontainers';
import { chooseExperimentSubnet } from './experiment-network.js';

const exec = promisify(execFile);
export const EXPERIMENT_IMAGE = 'voz-da-rua-p01-postgis@sha256:bc918a934e61985d08a51406d1d7e753a7d15e3206dd0f0923d75923e76c2893';
export const experimental = process.env.AUTH_SQL_EXPERIMENT === 'local-restricted-2026-11-13';
const runId = `vdr-sql-${randomUUID()}`;
const report: Record<string, unknown> = { designation: 'TESTE EXPERIMENTAL — NÃO APROVADO PARA PRODUÇÃO.', runId, image: EXPERIMENT_IMAGE };
const reportPath = new URL(`../../../.local/${runId}.json`, import.meta.url);
function save() { writeFileSync(reportPath, JSON.stringify(report, null, 2)); }
async function docker(...args: string[]) { return (await exec('docker', args, { maxBuffer: 4 * 1024 * 1024 })).stdout; }
let explicitSubnet:string|undefined;
async function freeSubnet(){
  if(process.platform!=='win32')throw new Error('Explicit experiment subnet preflight requires the authorized Windows host');
  const ids=(await docker('network','ls','-q')).trim().split(/\s+/).filter(Boolean);
  const networks=ids.length?JSON.parse(await docker('network','inspect',...ids)) as {IPAM:{Config:{Subnet?:string}[]|null}}[]:[];
  const result=await exec('powershell',['-NoProfile','-Command','@(Get-NetRoute -AddressFamily IPv4 -ErrorAction Stop | Select-Object -ExpandProperty DestinationPrefix) | ConvertTo-Json -Compress']);
  const parsed:unknown=JSON.parse(result.stdout);const routes=Array.isArray(parsed)?parsed:[parsed];
  if(!routes.length||routes.some((r)=>typeof r!=='string'))throw new Error('Host route preflight unavailable');
  return chooseExperimentSubnet([...networks.flatMap((n)=>(n.IPAM.Config??[]).map((c)=>c.Subnet).filter((s):s is string=>Boolean(s))),...routes as string[]]);
}

export class ExperimentalPostgres extends PostgreSqlContainer {
  constructor(image: string) {
    super(image);
    if (!experimental || image !== EXPERIMENT_IMAGE) throw new Error('Experimental authorization mismatch');
    this.withAutoCleanup(false).withAutoRemove(false).withUser('postgres')
      .withNetworkMode(runId).withDroppedCapabilities('ALL')
      .withSecurityOpt('no-new-privileges:true').withResourcesQuota({ memory: 0.5, cpu: 1 })
      .withLabels({ 'voz-da-rua.sql-experiment': runId }).withWaitStrategy(Wait.forHealthCheck());
    this.exposedPorts = [];
    this.createOpts.ExposedPorts = {};
    this.hostConfig.PortBindings = {};
    this.hostConfig.Binds = [`${runId}:/var/lib/postgresql/data:rw`];
  }
  protected override async beforeContainerCreated() {
    explicitSubnet=await freeSubnet();
    await docker('network', 'create', '--internal','--subnet',explicitSubnet, '--label', `voz-da-rua.sql-experiment=${runId}`, runId);
    await docker('volume', 'create', '--label', `voz-da-rua.sql-experiment=${runId}`, runId);
    report.resources = { network: runId, volume: runId,subnet:explicitSubnet };
    save();
  }
  protected override async containerCreated(id: string) {
    const [c] = JSON.parse(await docker('inspect', id));
    const [n] = JSON.parse(await docker('network', 'inspect', runId));
    const [v] = JSON.parse(await docker('volume', 'inspect', runId));
    const valid = c.Config.User === 'postgres' && !c.HostConfig.Privileged &&
      c.HostConfig.Memory === 536870912 && c.HostConfig.NanoCpus === 1000000000 &&
      c.HostConfig.NetworkMode === runId && n.Internal === true && n.IPAM.Config.some((p:{Subnet:string})=>p.Subnet===explicitSubnet) &&
      n.Labels['voz-da-rua.sql-experiment'] === runId && v.Labels['voz-da-rua.sql-experiment'] === runId &&
      c.Mounts.length === 1 && c.Mounts[0].Type === 'volume' && c.Mounts[0].Name === runId &&
      c.Mounts[0].Destination === '/var/lib/postgresql/data' &&
      Object.keys(c.HostConfig.PortBindings ?? {}).length === 0 &&
      c.HostConfig.CapDrop.includes('ALL') && c.HostConfig.SecurityOpt.includes('no-new-privileges:true') &&
      !(c.HostConfig.Devices?.length) && !(c.HostConfig.CapAdd?.length);
    report.preStart = { passed: valid, containerId: id, internalNetwork: n.Internal, mounts: c.Mounts.map((m: { Type: string; Name: string; Destination: string }) => ({ type: m.Type, name: m.Name, destination: m.Destination })), memory: c.HostConfig.Memory, nanoCpus: c.HostConfig.NanoCpus };
    save();
    if (!valid) throw new Error('Experimental isolation preconditions failed; container not started');
  }
}

export async function checkExperimentalIsolation(id: string) {
  const [c] = JSON.parse(await docker('inspect', id));
  const networks = Object.keys(c.NetworkSettings.Networks);
  const ports = Object.values(c.NetworkSettings.Ports).flat() as { HostIp: string }[];
  const valid = networks.length === 1 && networks[0] === runId && ports.every((p) => p.HostIp === '127.0.0.1');
  report.running = { passed: valid, networks, ports };
  save();
  if (!valid) { await docker('stop', id); throw new Error('Isolation failure; experimental container stopped'); }
}

export function recordExperiment(key: string, value: unknown) { report[key] = value; save(); }

export async function stopPartialExperiment() {
  const preStart = report.preStart as { containerId?: string } | undefined;
  if (!preStart?.containerId) return;
  const [c] = JSON.parse(await docker('inspect', preStart.containerId));
  if (c.State.Running) await docker('stop', preStart.containerId);
  recordExperiment('stopped', true);
}

// Fixed transport to PostgreSQL loopback inside this experiment's container.
// Credentials remain in the pg wire protocol, never Docker arguments or output.
const forward = `use strict; use warnings; use IO::Socket::INET; use IO::Select;
my $sock=IO::Socket::INET->new(PeerAddr=>'127.0.0.1',PeerPort=>5432,Proto=>'tcp') or die 'Local SQL unavailable';
binmode STDIN; binmode STDOUT; my $sel=IO::Select->new(\\*STDIN,$sock);
while(1){ for my $fh($sel->can_read){ my $n=sysread($fh,my $buf,65536); exit if !defined($n)||$n==0;
my $out=fileno($fh)==fileno(STDIN)?$sock:\\*STDOUT;
while(length($buf)){my $w=syswrite($out,$buf);exit if !defined($w);substr($buf,0,$w,'');}}}`;

class DockerSqlStream extends Duplex {
  private child?: ChildProcessWithoutNullStreams;
  constructor(private readonly containerId: string) { super(); }
  setNoDelay() { return this; }
  setKeepAlive() { return this; }
  ref() { return this; }
  unref() { return this; }
  connect() {
    this.child = spawn('docker', ['exec', '-i', '--user', 'postgres', this.containerId, 'perl', '-e', forward], { windowsHide: true, stdio: 'pipe' });
    this.child.once('spawn', () => this.emit('connect'));
    this.child.once('error', () => this.destroy(new Error('Experimental SQL transport unavailable')));
    this.child.stdout.on('data', (chunk) => { if (!this.push(chunk)) this.child!.stdout.pause(); });
    this.child.stdout.on('end', () => this.push(null));
    this.child.stderr.resume();
    this.child.on('exit', (code) => { if (code && !this.destroyed) this.destroy(new Error('Experimental SQL transport failed')); });
    return this;
  }
  override _read() { this.child?.stdout.resume(); }
  override _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    this.child!.stdin.write(chunk, encoding, callback);
  }
  override _final(callback: (error?: Error | null) => void) { this.child?.stdin.end(); callback(); }
  override _destroy(error: Error | null, callback: (error: Error | null) => void) {
    this.child?.stdin.end(); this.child?.kill(); callback(error);
  }
}

export function experimentalPool(containerId: string, database: string, user: string, password: string) {
  return new Pool({ ...databasePoolConfig({ database, user, password, host: '127.0.0.1', port: 5432 }), ssl: false,
    stream: () => new DockerSqlStream(containerId) });
}
