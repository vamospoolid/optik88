import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly dbPath = path.join(process.cwd(), 'database.sqlite');
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor() {
    this.ensureBackupDirectoryExists();
  }

  private ensureBackupDirectoryExists() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`Created backup directory at ${this.backupDir}`);
    }
  }

  // Backup automatically every midnight (CronExpression.EVERY_DAY_AT_MIDNIGHT)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleCron() {
    this.logger.log('Initiating scheduled database backup...');
    this.performBackup();
  }

  // Also can be called manually
  public performBackup() {
    try {
      this.ensureBackupDirectoryExists();

      if (!fs.existsSync(this.dbPath)) {
        this.logger.warn('Database file not found, nothing to backup.');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `database-backup-${timestamp}.sqlite`;
      const destPath = path.join(this.backupDir, backupFilename);

      fs.copyFileSync(this.dbPath, destPath);
      this.logger.log(`Database backup successful: ${backupFilename}`);
      
      this.cleanupOldBackups();
    } catch (error) {
      this.logger.error(`Database backup failed: ${error.message}`, error.stack);
    }
  }

  private cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      
      // Filter only backup files and sort by creation date
      const backupFiles = files
        .filter(file => file.startsWith('database-backup-') && file.endsWith('.sqlite'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          return {
            name: file,
            path: filePath,
            stats: fs.statSync(filePath)
          };
        })
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime()); // Newest first

      // Keep only last 7 backups
      const MAX_BACKUPS = 7;
      if (backupFiles.length > MAX_BACKUPS) {
        const filesToDelete = backupFiles.slice(MAX_BACKUPS);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          this.logger.log(`Deleted old backup: ${file.name}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error cleaning up old backups: ${error.message}`);
    }
  }
}
